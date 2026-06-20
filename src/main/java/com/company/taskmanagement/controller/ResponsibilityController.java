package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Responsibility;
import com.company.taskmanagement.service.ResponsibilityService;



@RestController
@RequestMapping("/api/responsibilities")
public class ResponsibilityController {

	@Autowired
	private ResponsibilityService responsibilityService;

	@PostMapping
	public Responsibility saveResponsibility(@RequestBody Responsibility responsibility) {

		return responsibilityService.saveResponsibility(responsibility);
	}

	@GetMapping
	public List<Responsibility> getAllResponsibilities() {

		return responsibilityService.getAllResponsibilities();
	}

	@GetMapping("/role/{roleId}")
	public List<Responsibility> getByRole(@PathVariable Long roleId) {

		return responsibilityService.getResponsibilitiesByRole(roleId);
	}
	
	@PostMapping("/test")
	public Responsibility test(@org.springframework.web.bind.annotation.RequestBody Responsibility responsibility) {

	    System.out.println("Before Save = " + responsibility.getResponsibilityName());

	    Responsibility saved = responsibilityService.saveResponsibility(responsibility);

	    System.out.println("After Save ID = " + saved.getId());

	    return saved;
	}
}
