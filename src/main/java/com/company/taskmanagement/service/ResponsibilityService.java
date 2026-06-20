package com.company.taskmanagement.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Responsibility;
import com.company.taskmanagement.repository.ResponsibilityRepository;

@Service
public class ResponsibilityService {

	@Autowired
	private ResponsibilityRepository responsibilityRepository;

	public Responsibility saveResponsibility(Responsibility responsibility) {

		return responsibilityRepository.save(responsibility);
	}

	public List<Responsibility> getResponsibilitiesByRole(Long roleId) {

		return responsibilityRepository.findByRoleId(roleId);
	}

	public List<Responsibility> getAllResponsibilities() {

		return responsibilityRepository.findAll();
	}
}
